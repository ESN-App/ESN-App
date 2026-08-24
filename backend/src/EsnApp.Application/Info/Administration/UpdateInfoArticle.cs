using EsnApp.Application.Common;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Info;

public record UpdateInfoArticleCommand(
    Guid Id,
    string Title,
    string Slug,
    string Content,
    string Category,
    string ImagePath,
    IReadOnlyList<string> ExternalLinks) : IRequest<Result<InfoArticleDto>>;

public class UpdateInfoArticleCommandValidator : AbstractValidator<UpdateInfoArticleCommand>
{
    public UpdateInfoArticleCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
        RuleFor(command => command.Title).NotEmpty().MaximumLength(200);
        RuleFor(command => command.Slug)
            .NotEmpty()
            .MaximumLength(200)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");
        RuleFor(command => command.Content).NotEmpty().MaximumLength(50_000);
        RuleFor(command => command.Category).NotEmpty().MaximumLength(100);
        RuleFor(command => command.ImagePath).NotEmpty().MaximumLength(2000);
        RuleFor(command => command.ExternalLinks)
            .NotNull()
            .Must(links => links is not null && links.Count <= 20);
        RuleForEach(command => command.ExternalLinks)
            .NotEmpty()
            .MaximumLength(2000)
            .Must(link => Uri.TryCreate(link, UriKind.Absolute, out var uri)
                && uri.Scheme is "http" or "https")
            .WithMessage("External links must be absolute HTTP or HTTPS URLs.");
    }
}

public class UpdateInfoArticleCommandHandler(IInfoArticleRepository repository)
    : IRequestHandler<UpdateInfoArticleCommand, Result<InfoArticleDto>>
{
    public async Task<Result<InfoArticleDto>> Handle(
        UpdateInfoArticleCommand request,
        CancellationToken cancellationToken)
    {
        var article = await repository.GetAdminByIdAsync(request.Id, cancellationToken);
        if (article is null)
            return Result.Failure<InfoArticleDto>($"Info article '{request.Id}' was not found.");

        if (await repository.SlugExistsAsync(request.Slug, request.Id, cancellationToken))
            return Result.Failure<InfoArticleDto>($"Slug '{request.Slug}' is already in use.");

        article.Title = request.Title.Trim();
        article.Slug = request.Slug;
        article.Content = request.Content;
        article.Category = request.Category.Trim();
        article.ImagePath = request.ImagePath;
        article.ExternalLinks = [.. request.ExternalLinks];

        return Result.Success(InfoArticleDto.FromEntity(
            await repository.UpdateAsync(article, cancellationToken)));
    }
}
