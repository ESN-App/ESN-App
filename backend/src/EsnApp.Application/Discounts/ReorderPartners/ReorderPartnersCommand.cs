using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.ReorderPartners;

public record ReorderPartnersCommand(IReadOnlyList<Guid> PartnerIds)
    : IRequest<Result<IReadOnlyList<PartnerDto>>>;
