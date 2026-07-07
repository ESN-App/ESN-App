using EsnApp.Application.Common;
using EsnApp.Domain.Discounts;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Discounts;

public record CreatePartnerCommand(
    string Name,
    string Description,
    string? WebsiteUrl) : IRequest<Result<PartnerDto>>;

public class CreatePartnerCommandValidator : AbstractValidator<CreatePartnerCommand>
{
    public CreatePartnerCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(200);
    }
}

public class CreatePartnerCommandHandler(IPartnerRepository repository)
    : IRequestHandler<CreatePartnerCommand, Result<PartnerDto>>
{
    public async Task<Result<PartnerDto>> Handle(
        CreatePartnerCommand request,
        CancellationToken cancellationToken)
    {
        var entity = new Partner
        {
            Name = request.Name,
            Description = request.Description,
            WebsiteUrl = request.WebsiteUrl,
        };

        var created = await repository.AddAsync(entity, cancellationToken);

        return Result.Success(PartnerDto.FromEntity(created));
    }
}
