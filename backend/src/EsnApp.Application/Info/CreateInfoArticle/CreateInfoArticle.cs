using EsnApp.Application.Common;
using EsnApp.Domain.Info;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Info;

public record CreateInfoArticleCommand(
    string Title,
    string Slug,
    string Content,
    string Category,
    Uri ImageUrl,
    IReadOnlyList<string> ExternalLinks) : IRequest<Result<InfoArticleDto>>;

public class CreateInfoArticleCommandValidator : AbstractValidator<CreateInfoArticleCommand>
{
    public CreateInfoArticleCommandValidator()
    {
        RuleFor(c => c.Title).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Slug)
            .NotEmpty()
            .MaximumLength(200)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");
        RuleFor(c => c.Content).NotEmpty().MaximumLength(50_000);
        RuleFor(c => c.Category).NotEmpty().MaximumLength(100);
        RuleFor(c => c.ImageUrl)
            .NotNull()
            .Must(url => url is not null && url.Scheme is "http" or "https")
            .WithMessage("ImageUrl must use HTTP or HTTPS.");
        RuleFor(c => c.ExternalLinks)
            .NotNull()
            .Must(links => links is not null && links.Count <= 20);
        RuleForEach(c => c.ExternalLinks)
            .NotEmpty()
            .MaximumLength(2000)
            .Must(link => Uri.TryCreate(link, UriKind.Absolute, out var uri)
                && uri.Scheme is "http" or "https")
            .WithMessage("External links must be absolute HTTP or HTTPS URLs.");
    }
}

public class CreateInfoArticleCommandHandler(IInfoArticleRepository repository)
    : IRequestHandler<CreateInfoArticleCommand, Result<InfoArticleDto>>
{
    public async Task<Result<InfoArticleDto>> Handle(
        CreateInfoArticleCommand request,
        CancellationToken cancellationToken)
    {
        if (await repository.SlugExistsAsync(request.Slug, cancellationToken: cancellationToken))
        {
            return Result.Failure<InfoArticleDto>($"Slug '{request.Slug}' is already in use.");
        }

        var entity = new InfoArticle
        {
            Title = request.Title.Trim(),
            Slug = request.Slug,
            Content = request.Content,
            Category = request.Category.Trim(),
            ImageUrl = request.ImageUrl,
            ExternalLinks = [.. request.ExternalLinks],
        };

        var created = await repository.AddAsync(entity, cancellationToken);

        return Result.Success(InfoArticleDto.FromEntity(created));
    }
}
